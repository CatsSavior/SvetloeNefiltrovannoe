import React from 'react';
import connect from '@vkontakte/vkui-connect';
import { View, Panel, PanelHeader, Group, List, Cell, PullToRefresh, Gallery } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

function Post(props) {
	let post = props.post;
	return (
		<Cell>{post.text}</Cell>
	);
}

/*<Gallery slideWidth="100%" bullets="dark">
											{post.attachments.map((attachment, j) => {
												return <img src="https://media.licdn.com/dms/image/C560BAQHQAKQeZ_nTOw/company-logo_200_200/0?e=2159024400&v=beta&t=woTFVXrEZDfdZSrYX2YstCLWH-Ihq9k_VSurWCJ0i20"/>
											})}
										</Gallery>*/

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isFetching: false,
			access_token: "",
			posts: []
		};

		this.onRefresh = () => {
			connect.send("VKWebAppCallAPIMethod", {"method": "newsfeed.get", "params": {"v":"5.95", "access_token": this.state.access_token}});
			this.setState({isFetching: true});

			setTimeout(() => {
				this.setState({isFetching: false});
			}, 1000);
		}

		connect.send("VKWebAppGetAuthToken", {"app_id": 6979496, "scope": "wall,friends"});

		connect.subscribe((e) => {
			switch (e.detail.type) {
				case 'VKWebAppAccessTokenReceived':
					this.setState({ access_token: e.detail.data.access_token });
					break;

				case "VKWebAppCallAPIMethodResult":
					let items = e.detail.data.response.items;
					items.filter(item => item.type === "post");
					this.setState({ posts: items })
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
						<Group>
							<List>
								<Cell>{this.state.access_token}</Cell>
								{this.state.posts.map((post, i) => {
									return <Post post={post}/>
								})}
							</List>
						</Group>
					</PullToRefresh>

				</Panel>
			</View>
		);
	}
}

export default App;
