import {
    post,
    supportChatApi,
} from '../api/http';

export default class Support {



    // SENDS A MESSAGE TO THE AI SUPPORT AGENT AND WAITS FOR A RESPONSE
    static async sendMessage(message) {
        const { data } = await post(supportChatApi, { message });
        return data;
    }
}
