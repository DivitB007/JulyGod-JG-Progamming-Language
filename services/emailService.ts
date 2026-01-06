import emailjs from '@emailjs/browser';
import { JGVersion } from '../App';

const STORAGE_KEY_SERVICE = 'jg_email_service_id';
const STORAGE_KEY_TEMPLATE = 'jg_email_template_id';
const STORAGE_KEY_PUBLIC = 'jg_email_public_key';

export interface EmailConfig {
    serviceId: string;
    templateId: string;
    publicKey: string;
}

export const emailService = {
    // Save configuration
    saveConfig: (config: EmailConfig) => {
        localStorage.setItem(STORAGE_KEY_SERVICE, config.serviceId);
        localStorage.setItem(STORAGE_KEY_TEMPLATE, config.templateId);
        localStorage.setItem(STORAGE_KEY_PUBLIC, config.publicKey);
        
        // Initialize immediately
        emailjs.init(config.publicKey);
    },

    // Get configuration
    getConfig: (): EmailConfig | null => {
        const s = localStorage.getItem(STORAGE_KEY_SERVICE);
        const t = localStorage.getItem(STORAGE_KEY_TEMPLATE);
        const p = localStorage.getItem(STORAGE_KEY_PUBLIC);
        if (s && t && p) return { serviceId: s, templateId: t, publicKey: p };
        return null;
    },

    clearConfig: () => {
        localStorage.removeItem(STORAGE_KEY_SERVICE);
        localStorage.removeItem(STORAGE_KEY_TEMPLATE);
        localStorage.removeItem(STORAGE_KEY_PUBLIC);
    },

    // Send Email
    sendUnlockRequest: async (
        username: string, 
        uid: string, 
        version: JGVersion, 
        price: string, 
        utr: string
    ): Promise<boolean> => {
        const config = emailService.getConfig();
        
        if (!config) {
            console.warn("EmailJS not configured.");
            return false;
        }

        try {
            // Re-init to be safe
            emailjs.init(config.publicKey);

            const templateParams = {
                username,
                uid,
                version,
                price,
                utr,
                date: new Date().toLocaleString()
            };

            const response = await emailjs.send(
                config.serviceId,
                config.templateId,
                templateParams
            );

            if (response.status === 200) {
                console.log("SUCCESS! Email sent.");
                return true;
            }
            return false;
        } catch (error) {
            console.error("FAILED to send email:", error);
            return false;
        }
    }
};