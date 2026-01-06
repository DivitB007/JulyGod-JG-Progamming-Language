import emailjs from '@emailjs/browser';
import { JGVersion } from '../App';
import { authService } from './firebase';

const PUBLIC_KEY = "AR5KtQxb-EtsT_MTX";
const TEMPLATE_ID = "template_a79gyow";
const SERVICE_ID = "service_g7d8eur";
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

emailjs.init(PUBLIC_KEY);

interface EmailConfig {
    serviceId: string;
    templateId: string;
    publicKey: string;
}

export const emailService = {
    getConfig: (): EmailConfig | null => {
        const stored = localStorage.getItem('jg_email_config');
        return stored ? JSON.parse(stored) : null;
    },

    saveConfig: (config: EmailConfig) => {
        localStorage.setItem('jg_email_config', JSON.stringify(config));
        emailjs.init(config.publicKey);
    },

    clearConfig: () => {
        localStorage.removeItem('jg_email_config');
    },

    sendTestEmail: async (): Promise<boolean> => {
        const config = emailService.getConfig();
        const s_id = config?.serviceId || SERVICE_ID;
        const t_id = config?.templateId || TEMPLATE_ID;
        const p_key = config?.publicKey || PUBLIC_KEY;

        const response = await emailjs.send(
            s_id,
            t_id,
            {
                username: "Connectivity Test",
                user_email: "test@julygod.com",
                uid: "test-uid",
                version: "v1.2",
                price: "0",
                utr: "TEST-UTR-12345",
                redeem_code: "JG-TEST-0000",
                date: new Date().toLocaleString(),
                to_email: ADMIN_EMAIL,
                unlock_url: `${window.location.origin}/#/unlock?action=unlock&target_uid=test-uid&target_ver=v1.2`,
                deny_url: `${window.location.origin}/#/unlock?action=deny&target_uid=test-uid&target_ver=v1.2`
            },
            p_key
        );
        return response.status === 200;
    },

    sendUnlockRequest: async (
        username: string, 
        uid: string, 
        version: JGVersion, 
        price: string, 
        utr: string,
        redeemCode: string
    ): Promise<boolean> => {
        const userEmail = authService.getCurrentEmail() || 'Not Provided';
        const baseUrl = window.location.origin + window.location.pathname;
        const unlockUrl = `${baseUrl}#/unlock?action=unlock&target_uid=${uid}&target_ver=${version}`;
        const denyUrl = `${baseUrl}#/unlock?action=deny&target_uid=${uid}&target_ver=${version}`;

        const config = emailService.getConfig();
        const s_id = config?.serviceId || SERVICE_ID;
        const t_id = config?.templateId || TEMPLATE_ID;
        const p_key = config?.publicKey || PUBLIC_KEY;

        try {
            const response = await emailjs.send(
                s_id,
                t_id,
                {
                    username,
                    user_email: userEmail,
                    uid,
                    version,
                    price,
                    utr,
                    redeem_code: redeemCode,
                    date: new Date().toLocaleString(),
                    to_email: ADMIN_EMAIL,
                    unlock_url: unlockUrl,
                    deny_url: denyUrl
                },
                p_key
            );
            return response.status === 200;
        } catch (error: any) {
            console.error("Email send failed:", error);
            return false;
        }
    }
};
