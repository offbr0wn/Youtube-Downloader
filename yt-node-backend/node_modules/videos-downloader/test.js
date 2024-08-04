import s from "./app.js";
import 'dotenv/config'


async function test(params) {

    // console.log(await s.facebook('https://www.facebook.com/watch?v=1375506373158765'));

    // console.log(await s.instagram('https://www.instagram.com/p/C8rm4o5ykvb/'));

    // console.log(await s.twitter('https://x.com/IrishPatri0t/status/1806853301192753309'));

    console.log(await s.youtube('https://www.youtube.com/watch?v=MvsAesQ-4zA'));

}
test()