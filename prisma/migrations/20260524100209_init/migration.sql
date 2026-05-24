-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession_primary" TEXT NOT NULL,
    "profession_sub" TEXT NOT NULL,
    "experience_years" TEXT NOT NULL,
    "experience_label" TEXT NOT NULL,
    "primary_goal" TEXT NOT NULL,
    "background_note" TEXT,
    "notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notification_preferred_time" TEXT NOT NULL DEFAULT '07:00',
    "weekly_signal_enabled" BOOLEAN NOT NULL DEFAULT false,
    "fcm_tokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_reads" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reengagement_sent_at" TIMESTAMP(3),
    "growth_profile" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_date" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "estimated_read_minutes" INTEGER NOT NULL DEFAULT 2,
    "personalization_used" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generation_attempts" INTEGER NOT NULL DEFAULT 1,
    "used_backup" BOOLEAN NOT NULL DEFAULT false,
    "hook_line" TEXT NOT NULL,
    "sub_line" TEXT NOT NULL DEFAULT '',
    "notification_text" TEXT NOT NULL,
    "notification_style" TEXT NOT NULL DEFAULT 'curiosity',
    "content" JSONB NOT NULL,
    "image_url" TEXT,
    "image_prompt" TEXT,
    "image_generated" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRead" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_date" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_duration_seconds" INTEGER,

    CONSTRAINT "ContentRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_date" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupContent" (
    "id" TEXT NOT NULL,
    "profession_primary" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hook_line" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "image_url" TEXT,
    "times_served" INTEGER NOT NULL DEFAULT 0,
    "last_served_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebase_uid_key" ON "User"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_firebase_uid_idx" ON "User"("firebase_uid");

-- CreateIndex
CREATE INDEX "User_notification_preferred_time_idx" ON "User"("notification_preferred_time");

-- CreateIndex
CREATE INDEX "User_last_active_idx" ON "User"("last_active");

-- CreateIndex
CREATE INDEX "DailyContent_user_id_idx" ON "DailyContent"("user_id");

-- CreateIndex
CREATE INDEX "DailyContent_content_date_idx" ON "DailyContent"("content_date");

-- CreateIndex
CREATE INDEX "DailyContent_notification_sent_idx" ON "DailyContent"("notification_sent");

-- CreateIndex
CREATE UNIQUE INDEX "DailyContent_user_id_content_date_key" ON "DailyContent"("user_id", "content_date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRead_content_id_key" ON "ContentRead"("content_id");

-- CreateIndex
CREATE INDEX "ContentRead_user_id_idx" ON "ContentRead"("user_id");

-- CreateIndex
CREATE INDEX "ContentRead_content_date_idx" ON "ContentRead"("content_date");

-- CreateIndex
CREATE INDEX "Reflection_user_id_idx" ON "Reflection"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_user_id_content_id_key" ON "Reflection"("user_id", "content_id");

-- CreateIndex
CREATE INDEX "BackupContent_profession_primary_idx" ON "BackupContent"("profession_primary");

-- CreateIndex
CREATE INDEX "BackupContent_pillar_idx" ON "BackupContent"("pillar");

-- AddForeignKey
ALTER TABLE "ContentRead" ADD CONSTRAINT "ContentRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRead" ADD CONSTRAINT "ContentRead_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "DailyContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "DailyContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
