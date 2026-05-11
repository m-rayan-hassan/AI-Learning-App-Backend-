import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  const { data, error } = await resend.emails.send({
    from: "Cognivio AI <noreply@cognivioai.app>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,

  })
  return data;
};

export default sendEmail;
