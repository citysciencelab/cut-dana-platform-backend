import {Router} from "express";
import * as steps_controller from "../controllers/steps_controller.js";
import * as stories_controller from "../controllers/stories_controller.js";
import * as images_controller from "../controllers/images_controller.js";

const router = new Router();


// GET
router.get("/s/:story_id/:step_index", stories_controller.redirectToStep);
router.get("/story", stories_controller.getStories);
router.get("/dipastoryselector", stories_controller.getStoriesForDipas);
router.get("/story/:story_id", stories_controller.getStoryStructure);
router.get("/image/:image_hash", images_controller.getImageById);
// router.get("/step/:story_id", steps_controller.getStepsByStoryId);
router.get("/step/:story_id/:step_major/:step_minor/html", steps_controller.getHtml);
// router.get("/step/:story_id/:step_major/:step_minor", steps_controller.getStoryStep);


// POST
router.post("/story", stories_controller.create);
router.post("/add/step/:story_id/:step_major/:step_minor", steps_controller.addHtml);
router.post("/add/step/:story_id/:step_major/:step_minor/:image_hash/image", images_controller.imageUpload.single("image"), images_controller.addImagePath);
router.post("/add/step/:story_id/:step_major/:step_minor/html", steps_controller.addHtml);


// DELETE
router.delete("/story/:story_id", stories_controller.deleteStory);
// router.delete("/delete/step/:story_id/", steps_controller.deleteAllStorySteps);
// router.delete("/delete/step/:story_id/:step_major/", steps_controller.deleteStepMajor);
// router.delete("/delete/step/:story_id/:step_major/:step_minor", steps_controller.deleteStepMinor);


// DEBUGGING
// router.get("/debug/step", steps_controller.getSteps);
router.get("/debug/story", stories_controller.getStoriesAllData);

export default router;
