import {Router} from "express";
import mongoSanitize from "express-mongo-sanitize";
import * as images_controller from "../controllers/images_controller.js";
import * as stories_controller from "../controllers/stories_controller.js";
import {unsplash} from "../utils/unsplash.js";

const router = new Router();


// GET
router.get("/s/:story_id/:step_index", stories_controller.redirectToStep);
router.get("/stories", stories_controller.index);
router.get("/stories/:story_id", stories_controller.show);
router.get("/images/suggest", async (req, res) => {
    const query = req.query.q;

    try {
        const response = await unsplash.search.getPhotos({
                query: query,
                page: 1,
                perPage: 10,
                orientation: "landscape"
            }),

            results = response.response.results.map((result) => ({
                id: result.id,
                url: result.urls.regular,
                user: {
                    id: result.user.id,
                    name: result.user.name
                }
            }));

        return res.json(results);
    }
    catch (error) {
        return res.json([]);
    }

});

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
router.patch("/stories/:story_id/featured",
    stories_controller.featured
);
router.patch("/stories/:story_id",
    mongoSanitize(),
    stories_controller.update
);

// DELETE
router.delete("/stories/:story_id", stories_controller.remove);

export default router;
