import {Router} from "express";
import mongoSanitize from "express-mongo-sanitize";
import * as stories_controller from "../controllers/stories_controller.js";
import * as images_controller from "../controllers/images_controller.js";

const router = new Router();


// GET
router.get("/s/:story_id/:step_index", stories_controller.redirectToStep);
router.get("/stories", stories_controller.index);
router.get("/stories/:story_id", stories_controller.show);

// DIPAS
router.get("/dipastoryselector", stories_controller.getStoriesForDipas);


// POST
router.post("/stories",
    mongoSanitize(),
    stories_controller.create
);
router.post("/images/:story_id/:step_major/:step_minor/:image_hash",
    images_controller.imageUpload.single("image"),
    images_controller.addImagePath
);

// PATCH
router.patch("/stories/:story_id/:step_major/:step_minor/html",
    mongoSanitize(),
    stories_controller.updateHtml
);
router.patch("/stories/:story_id",
    mongoSanitize(),
    stories_controller.update
);

// DELETE
router.delete("/stories/:story_id", stories_controller.remove);

export default router;
