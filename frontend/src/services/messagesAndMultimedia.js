import { post, get, messagesApi, messagesUploadApi, myMessagesApi } from '../api/http';

/**
 * Messages and Multimedia service.
 * All functions wrap existing HTTP client calls and match backend endpoints.
 */
export default class MessagesAndMultimedia {
	/**
	 * Create a text/message DTO
	 * @param {Object} body - CreateMessageDto { content, type, receiverId, senderId }
	 */
	static async createMessage(body) {
		return await post(messagesApi, body);
	}

	/**
	 * Upload a file and create a message referencing the uploaded multimedia.
	 * @param {File} file - file object from input
	 * @param {Object} body - additional fields: content, type, receiverId, senderId
	 */
	static async uploadMessage(file, body = {}) {
		const form = new FormData();
		form.append('file', file);
		// include other fields in form
		Object.keys(body || {}).forEach(k => {
			if (body[k] !== undefined && body[k] !== null) form.append(k, body[k]);
		});
		return await post(messagesUploadApi, form);
	}

	/**
	 * Get messages for the current authenticated user
	 */
	static async getMyMessages() {
		return await get(myMessagesApi, {});
	}
}
