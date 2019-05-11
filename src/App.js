import React from 'react';
import moment from 'moment';
import 'moment/locale/ru';
import connect from '@vkontakte/vkui-connect';
import { View, Panel, PanelHeader, Group, List, Cell, PullToRefresh, Footer, Div, Avatar, Button } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import Icon24LikeOutline from '@vkontakte/icons/dist/24/like_outline';
import Icon24Like from '@vkontakte/icons/dist/24/like';
import Icon24ShareOutline from '@vkontakte/icons/dist/24/share_outline';
import Icon24Share from '@vkontakte/icons/dist/24/share';
import Icon24View from '@vkontakte/icons/dist/24/view';

let access_token = '';
let users = {};
let groups = {};
let posts = [];
let nextFrom = '';

let tagRegexp = new RegExp('#([^\s]+)');
var urlRegexp = /(https?:\/\/[^\s]+)/g;

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

let like = (id) => {
	return () => {
		connect.send("VKWebAppCallAPIMethod", {"method": "likes.add", "request_id": "ignore", "params": {"v":"5.95", "item_id": id, "access_token": access_token}});
	}
}
	
function prepare(text) {
	let a = text.replace('\n', '<br>');
	//a = a.replace(urlRegexp, (url) => {return "<a target='_blank' href='" + url + "'>" + url + "</a>"});
	//a = a.replace(tagRegexp, (tag) => {return "<a target='_blank' href='https://vk.com/feed?section=search&q="+tag+"'>"+tag+"</a>"});
	return {__html: a};
}

function Text(props) {
	if (!props.text || props.text === "")
		return null;

	return (
		<Cell multiline><span dangerouslySetInnerHTML={prepare(props.text)}></span></Cell>
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

function LikesRepostsViews(props) {
	return (
		<Div style={{display: 'flex'}}>
			<Cell before={props.post.likes.user_likes == 1 ? <Icon24Like/> : <Icon24LikeOutline/>}
			      onClick={like(props.post.post_id)}> {props.post.likes.count} </Cell>
			<Cell before={<Icon24ShareOutline/>}>{props.post.reposts.count}</Cell>
			<Cell before={<Icon24View/>}>{props.post.views.count}</Cell>
		</Div>
	);
}

function shouldBeShown(post) {
	if (post.attachments) {
		for (let attachment of post.attachments) {
			if (attachment.type != "photo")
				return false;
		}
	}

	return true;
}

function Post(props) {
	let post = props.post;
	return (
		<Group>
			<Cell before={<Avatar src={getAvatarUrl(post.source_id)}/>} description={moment(post.date * 1000).fromNow()}>
				{getName(post.source_id)}
			</Cell>

			<Text text={post.text}/>
			<ShowCase attachments={post.attachments}/>
			<LikesRepostsViews post={post}/>
		</Group>
	);
}

class App extends React.Component {
	constructor(props) {
		super(props);
		moment.locale('ru');

		this.state = {
			isFetching: false,
		};

		this.onRefresh = () => {
			connect.send("VKWebAppCallAPIMethod", {"method": "newsfeed.get", "params": {"v":"5.95", "filters": "post", "access_token": access_token}});
			this.setState({isFetching: true, posts: [], nextFrom: ''});
		}

		this.nextPosts = () => {
			connect.send("VKWebAppCallAPIMethod", {"method": "newsfeed.get", "params": {"v":"5.95", "filters": "post", "start_from": nextFrom, "access_token": access_token}});
			this.setState({isFetching: true});
		}

		connect.send("VKWebAppGetAuthToken", {"app_id": 6979496, "scope": "wall,friends"});

		connect.subscribe((e) => {
			switch (e.detail.type) {
				case 'VKWebAppAccessTokenReceived':
					access_token = e.detail.data.access_token;
					this.onRefresh();
					break;

				case "VKWebAppCallAPIMethodResult":
					if (e.detail.data.request_id == "ignore")
						break;

					for (let fuck of e.detail.data.response.profiles) {
						users[fuck.id] = fuck;
					}

					for (let fuck of e.detail.data.response.groups) {
						groups[fuck.id] = fuck;
					}

					let items = e.detail.data.response.items;
					items = items.filter(item => item.type === "post" && shouldBeShown(item));
					for (let item of items)
						posts.push(item);

					nextFrom = e.detail.data.response.next_from;
					this.setState({ isFetching: false });
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

					<PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.isFetching} style={{"margin-left": "10px", "margin-right": "10px"}}>
						{posts.map((post, i) => {
							return <Post post={post}/>
						})}
					</PullToRefresh>

					<Footer>
						<Button onClick={this.nextPosts}>Загрузить больше</Button>
					</Footer>

				</Panel>
			</View>
		);
	}
}

export default App;
