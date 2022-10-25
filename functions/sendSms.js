import axios from 'axios';
import 'dotenv/config'

export const sendSms = async (message, number) => {

    try {
        const send = await axios.post(
            process.env.SMS_GATEWAY_URL, {
            text: message,
            number
        });

        if (send.data === "yes") return { status: "success" };

    } catch (err) {
        return { status: 'error' };
    }
}