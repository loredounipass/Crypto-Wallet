import { post, get, messagesApi, messagesUploadApi, myMessagesApi, apiOrigin } from '../api/http';

export default class MessagesAndMultimedia {


	// CREATES A NEW TEXT OR METADATA MESSAGE
	static async createMessage(body) {
		return await post(messagesApi, body);
	}




	// UPLOADS A FILE AND CREATES A DIRECT MESSAGE CONTAINING THE MULTIMEDIA
	static async uploadMessage(file, body = {}) {
		const form = new FormData();
		form.append('file', file);
		// include other fields in form
		Object.keys(body || {}).forEach(k => {
			if (body[k] !== undefined && body[k] !== null) form.append(k, body[k]);
		});
		return await post(messagesUploadApi, form);
	}




	// FETCHES ALL THE DIRECT MESSAGES FOR THE AUTHENTICATED USER
	static async getMyMessages() {
		return await get(myMessagesApi, {});
	}




	// RETURNS THE BASE API ORIGIN USED FOR RESOLVING SECURE MEDIA
	static getApiOrigin() {
		return apiOrigin;
	}




	// FETCHES A SECURE MULTIMEDIA FILE AS A BLOB OBJECT
	static async getSecureMedia(url) {
		return await get(url, null, { responseType: 'blob' });
	}
}
