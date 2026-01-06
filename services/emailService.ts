
import emailjs from '@emailjs/browser';
import { JGVersion } from '../App';

// --- HARDCODED ADMIN CREDENTIALS ---
// These are strictly managed here. No user-facing setup is required or allowed.
const PUBLIC_KEY = "AR5KtQxb-EtsT_MTX";
const TEMPLATE_ID = "template_a79gyow";
const SERVICE_ID = "service_g7d8eur";
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

// Initialize EmailJS immediately with the hardcoded Public Key
emailjs.init(PUBLIC_KEY);

export const emailService = {
    /**
     * Get the current EmailJS configuration from localStorage.
     */
    getConfig: () => {
        const stored = localStorage.getItem('jg_emailjs_config');
        return stored ? JSON.parse(stored) : null;
    },

    /**
     * Save the EmailJS configuration to localStorage.
     */
    saveConfig: (config: { serviceId: string; templateId: string; publicKey: string }) => {
        localStorage.setItem('jg_emailjs_config', JSON.stringify(config));
    },

    /**
     * Remove the EmailJS configuration from localStorage.
     */
    clearConfig: () => {
        localStorage.removeItem('jg_emailjs_config');
    },

    /**
     * Sends a test email to the admin to verify connectivity.
     */
    sendTestEmail: async (): Promise<boolean> => {
        // Use configured values if available, otherwise use defaults
        const config = emailService.getConfig();
        const s_id = config?.serviceId || SERVICE_ID;
        const t_id = config?.templateId || TEMPLATE_ID;
        const p_key = config?.publicKey || PUBLIC_KEY;

        try {
            const response = await emailjs.send(
                s_id,
                t_id,
                {
                    username: "Admin System Check",
                    uid: "SYSTEM_INTERNAL",
                    version: "V1.2 Final",
                    price: "1400",
                    utr: "000000000000",
                    date: new Date().toLocaleString(),
                    to_email: ADMIN_EMAIL,
                },
                p_key
            );
            return response.status === 200;
        } catch (error: any) {
            const msg = error?.text || error?.message || JSON.stringify(error);
            console.error("EmailJS Test Failure:", error);
            throw new Error(`EmailJS Error: ${msg}`);
        }
    },

    /**
     * Sends an unlock request to the admin with user and transaction details.
     */
    sendUnlockRequest: async (
        username: string, 
        uid: string, 
        version: JGVersion, 
        price: string, 
        utr: string
    ): Promise<boolean> => {
        // Use configured values if available, otherwise use defaults
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
                    uid,
                    version,
                    price,
                    utr,
                    date: new Date().toLocaleString(),
                    to_email: ADMIN_EMAIL,
                },
                p_key
            );

            return response.status === 200;
        } catch (error: any) {
            const msg = error?.text || error?.message || JSON.stringify(error);
            console.error("Email send failed detailed:", error);
            throw new Error(`EmailJS Error: ${msg}`);
        }
    }
};
