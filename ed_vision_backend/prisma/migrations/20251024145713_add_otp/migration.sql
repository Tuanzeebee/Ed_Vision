-- CreateTable
CREATE TABLE "public"."Otp" (
    "otp_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("otp_id")
);

-- CreateIndex
CREATE INDEX "Otp_account_id_idx" ON "public"."Otp"("account_id");

-- AddForeignKey
ALTER TABLE "public"."Otp" ADD CONSTRAINT "Otp_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;
