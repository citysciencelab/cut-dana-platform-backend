
import {createApi} from "unsplash-js";

const API_KEY = process.env.UNSPLASH_API_KEY || "",
    unsplash = createApi({
        accessKey: API_KEY
    });

export {
    unsplash
};
