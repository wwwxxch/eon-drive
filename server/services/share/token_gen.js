import dotenv from "dotenv";
dotenv.config();

const tokenLength = parseInt(process.env.SHARE_TOKEN_LENGTH);

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const shareTokenGenerator = () => {
  let token = "";
  for (let i = 0; i < tokenLength; i++) {
    const randomNumber = Math.floor(Math.random() * 62);
    token += base62.charAt(randomNumber);
  }
  return token;
};

export { shareTokenGenerator };
