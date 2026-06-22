import {
    post,
    supportChatApi,
} from '../api/http';

export default class Support {
    static async sendMessage(message) {
        const { data } = await post(supportChatApi, { message });
        return data;
    }
}
