-- CreateTable
CREATE TABLE "images" (
    "imageid" SERIAL NOT NULL,
    "storyid" INTEGER,
    "step_major" INTEGER,
    "step_minor" INTEGER,
    "hash" VARCHAR(100),
    "filetype" VARCHAR(40),

    CONSTRAINT "images_pkey" PRIMARY KEY ("imageid")
);

-- CreateTable
CREATE TABLE "steps" (
    "stepid" SERIAL NOT NULL,
    "storyid" INTEGER,
    "step_major" INTEGER,
    "step_minor" INTEGER,
    "html" TEXT,

    CONSTRAINT "steps_pkey" PRIMARY KEY ("stepid")
);

-- CreateTable
CREATE TABLE "stories" (
    "storyid" SERIAL NOT NULL,
    "title" VARCHAR(30),
    "category" VARCHAR(120),
    "description" TEXT,
    "author" TEXT,
    "story_json" JSONB,
    "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_published" TIMESTAMP(6),
    "highlight_index" INTEGER,
    "count_views" INTEGER,
    "reading_time" INTEGER,
    "story_interval" INTEGER,
    "display_type" VARCHAR(20),
    "lang_code" VARCHAR(10),
    "title_image" VARCHAR(100),

    CONSTRAINT "stories_pkey" PRIMARY KEY ("storyid")
);

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "storyid" FOREIGN KEY ("storyid") REFERENCES "stories"("storyid") ON DELETE NO ACTION ON UPDATE NO ACTION;
