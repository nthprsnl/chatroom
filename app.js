/* eslint-disable no-alert */
/* global firebase */

const db = firebase.database();
let username = '';
let roomname = '';
let chat;
let userId;
let currentChatSnapshot;
let currentColor;
let lastChat;
let currentUsers;
let users;

const colors = ['red', 'fuchsia', 'lime', 'yellow', 'blue', 'aqua'];
currentColor = colors[Math.floor(Math.random() * colors.length)];

const auth = firebase.auth();

const usernameInput = () => {
	username = prompt('username:');

	if (username === '') {
		alert('username cannot be empty!');
		username = usernameInput();
	}

	return localStorage.setItem('chatUsername', DOMPurify.sanitize(username));
};

const getFromDb = path => new Promise(res => { db.ref(path).once('value', snapshot => res(snapshot)); });

auth.signInAnonymously().then(({ user }) => {
	if (user) {
		if (!localStorage.getItem('chatUsername')) (usernameInput());
		username = localStorage.getItem('chatUsername');
		userId = user.uid;
		console.log('user logged in!');
		db.ref(`users/${userId}`).set({
			name: DOMPurify.sanitize(username),
			id: DOMPurify.sanitize(userId),
			color: DOMPurify.sanitize(currentColor)
		});
		db.ref(`users/${userId}`).onDisconnect().remove()

		db.ref(`rooms/`).on('child_added', messageSnapshot => {
			const message = messageSnapshot.val();
			const messageHtml = `<div class="roomitem">
				<h2 style="cursor:pointer;" onclick="document.getElementById('roominput').value = '${message.roomname}'; joinRoom();" class="roomtext">
					<abbr title="${message.roomname}">${message.roomname}</abbr>
				</h2>
				</div>`;
			document.getElementById('roomitems').innerHTML += messageHtml;
		});
		
		db.ref(`/`).on('child_added', messageSnapshot => {
			document.getElementById('loader').style.display = "none"
			document.getElementById('container').style.display = "block"
			db.ref('/').off()
		});

		currentChatSnapshot = db.ref(`rooms/messages/`);
		
		// this is a really bad makeshift but itll do
		db.ref("/users").once('value', snapshot => {document.getElementById('usercount').innerHTML = Object.keys(snapshot.val()).length})
		setInterval(function () {
			db.ref("/users").once('value', snapshot => {document.getElementById('usercount').innerHTML = Object.keys(snapshot.val()).length})
		}, 15000);

	} 
}).catch((error) => {
	const errcode = error.code;
	const errmsg = error.msg;

	console.log(errcode, errmsg, error);
	alert('whoops! something has gone wrong. look in devtools for more info!');
});

// eslint-disable-next-line no-unused-vars
const createRoom = async () => {
	if (username === '') {
		alert('set a username!');
		return username = usernameInput();
	}

	roomname = document.getElementById('roominput').value;
	if (roomname === '') {alert('room name cannot be empty!'); return};
	const room = await getFromDb(`rooms/${roomname}`);

	if (room.exists()) {alert('room already exists!'); return};

	// Sets room owner
	db.ref(`rooms/${roomname}`).set({ userId, roomname });
	console.log('Created room '.concat(room));
	joinRoom();
};

// eslint-disable-next-line no-unused-vars
const joinRoom = async () => {

	document.getElementById('msginput').style.display = "flex";
	document.getElementById('msginput').addEventListener('submit', function (event) {event.preventDefault()})
	if (currentChatSnapshot) currentChatSnapshot.off();

	if (username === '') {
		alert('set a username!');
		return username = usernameInput();
	}

	roomname = document.getElementById('roominput').value;
	if (roomname === '') return alert('room name cannot be empty!');
	if (roomname === lastChat) return alert('you cannot join the same room twice!');

	const room = await getFromDb(`rooms/${roomname}`);
	if (!room.exists()) {alert('room does not exist!'); return};

	chat = db.ref(`rooms/${roomname}/messages/`);
	document.getElementById('display-messages').innerHTML = `
    <li class='system'>[SYSTEM]: Welcome to ${roomname}!</li>
    <li class="system">[SYSTEM]: Please be nice and treat others how you want to be treated</li>
    <li class="system">[SYSTEM]: Join on 'main' for the main chatroom!</li>
    <li class="system">[SYSTEM]: Everything here is unmoderated, so be careful!</li>
  `;

	console.log(`Joined room ${roomname}`);

	document.getElementById('loader').style.display = "none"
	document.getElementById('container').style.display = "block"

	lastChat = roomname
	chat.on('child_added', messageSnapshot => {
		const message = messageSnapshot.val();
		const messageHtml = `<li>
		<abbr title="${DOMPurify.sanitize(message.userId)}" style="color: ${DOMPurify.sanitize(message.color)};">[${DOMPurify.sanitize(message.username)}]</abbr>: 
			${DOMPurify.sanitize(message.message)}
		</li>`;
		document.getElementById('display-messages').innerHTML += messageHtml;

		document
			.getElementById('display-messages')
			.scrollTo(0, document.getElementById('display-messages').scrollHeight, "smooth"); 
	});

	currentChatSnapshot = chat;
};

/* eslint-disable no-unused-vars */
const sendMessage = async () => {	
	const messageinput = document.getElementById('messageinput');
	const message = messageinput.value;

	if (message.replaceAll(' ', '') == '') return;

	const room = await getFromDb(`rooms/${roomname}`);
	if (!room.exists()) {return alert('room does not exist!')};

	db.ref(`rooms/${roomname}/messages/${Date.now()}`).set({
		username: DOMPurify.sanitize(username),
		message: DOMPurify.sanitize(message, {USE_PROFILES: {html: true}}),
		userId: DOMPurify.sanitize(userId),
		color: DOMPurify.sanitize(currentColor)
	});

	messageinput.value = '';
};

function createTag(type) {

	const types = {
		"bold":`<b> </b>`,
		"italic":`<i> </i>`,
		"underline":`<u> </u>`,
		"strikethrough":`<s> </s>`
	};

	return message += types[0]
}
db.ref(`rooms/messages/`).on('child_added', messageSnapshot => {
	const message = messageSnapshot.val();
	const messageHtml = `<li>
		<abbr title="${DOMPurify.sanitize(message.userId)}" style="color: ${DOMPurify.sanitize(message.color)};">[${DOMPurify.sanitize(message.username)}]</abbr>: 
			${DOMPurify.sanitize(message.message, {USE_PROFILES: {html: true}})}
		</li>`;
	document.getElementById('display-messages').innerHTML += messageHtml;

	document
		.getElementById('display-messages')
		.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
});

// nthprsnl, 2023
// celestial, 2023
