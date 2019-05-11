import React from 'react';
import connect from '@vkontakte/vkui-connect';
import { View, Panel, PanelHeader, Group, List, Cell, PullToRefresh, Gallery, Div, Avatar } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

let users = {};
let groups = {};

let getAvatarUrl = (source_id) => {
	if (source_id >= 0) {
		return users[source_id].photo_50;
	} else {
		return groups[-source_id].photo_50;
	}
}

let getName = (source_id) => {
	if (source_id >= 0) {
		return users[source_id].first_name + " " + users[source_id].last_name;
	} else {
		return groups[-source_id].name;
	}
}

/* VPizdu
<Gallery slideWidth="custom" style={{ height: 1000 }} bullets="dark">
			{photos.map((photo, j) => {
				return <div style={{"display": "inline-block"}}><img src={photo.photo.sizes[photo.photo.sizes.length - 1].url}/></div>
			})}
		</Gallery>*/

function Text(props) {
	if (!props.text || props.text === "")
		return null;

	return (
		<Cell multiline>
			{props.text}
		</Cell>
	);
}

function ShowCase(props) {
	if (!props.attachments)
		return null;

	let photos = props.attachments.filter(item => item.type === "photo");
	return (
		<Cell>
			<Div>
				{photos.map((photo, i) => {
					return <img style={{width: "100%"}} src={photo.photo.sizes[photo.photo.sizes.length - 1].url}/>;
				})}
			</Div>
		</Cell>
	);
}

//{JSON.stringify(post)}
function Post(props) {
	let post = props.post;
	return (
		<Group>
			<Cell before={<Avatar src={getAvatarUrl(post.source_id)}/>}>
				{getName(post.source_id)}
			</Cell>

			<Text text={post.text}/>
			<ShowCase attachments={post.attachments}/>
		</Group>
	);
}

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isFetching: false,
			access_token: "",
			posts: [],
		};

		this.onRefresh = () => {
			connect.send("VKWebAppCallAPIMethod", {"method": "newsfeed.get", "params": {"v":"5.95", "access_token": this.state.access_token}});
			this.setState({isFetching: true});
		}

		connect.send("VKWebAppGetAuthToken", {"app_id": 6979496, "scope": "wall,friends"});

		connect.subscribe((e) => {
			switch (e.detail.type) {
				case 'VKWebAppAccessTokenReceived':
					this.setState({ access_token: e.detail.data.access_token });
					this.onRefresh();
					break;

				case "VKWebAppCallAPIMethodResult":
					for (let fuck of e.detail.data.response.profiles) {
						users[fuck.id] = fuck;
					}

					for (let fuck of e.detail.data.response.groups) {
						groups[fuck.id] = fuck;
					}

					let items = e.detail.data.response.items;
					items = items.filter(item => item.type === "post");
					this.setState({ posts: items })
					this.setState({isFetching: false});
					break;

				default:
					console.log(e.detail.type);
			}
		});
	}

	render() {
		return (
			<View activePanel="mainPanel">
				<Panel id="mainPanel">
					<PanelHeader>Светлое нефильтрованное</PanelHeader>

					<PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.isFetching}>
						{this.state.posts.map((post, i) => {
							return <Post post={post}/>
						})}
					</PullToRefresh>

				</Panel>
			</View>
		);
	}
}

export default App;
