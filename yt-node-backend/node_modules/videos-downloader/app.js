import 'dotenv/config'

// import { configDotenv } from "dotenv";
import facebook from "./downloaders/facebook.js";
import instagram from "./downloaders/instagram.js";
import twitter from "./downloaders/twitter.js";
import youtube from "./downloaders/youtube.js";

const s = { twitter,instagram,youtube,facebook }
export default s;
 