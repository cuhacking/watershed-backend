import {MigrationInterface, QueryRunner} from "typeorm";

export class Applications1607047410370 implements MigrationInterface {
    name = 'Applications1607047410370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_1e89f1fd137dc7fea7242377e25"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "teamId" TO "applicationId"`);
        await queryRunner.query(`CREATE TABLE "application" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "pronouns" character varying NOT NULL, "email" character varying NOT NULL, "levelOfStudy" character varying NOT NULL, "program" character varying NOT NULL, "shortAnswer1" character varying NOT NULL, "shortAnswer2" character varying NOT NULL, "shortAnswer3" character varying NOT NULL, "numHackathons" integer NOT NULL, "siteUrl" character varying NOT NULL, "resume" bytea NOT NULL, CONSTRAINT "PK_569e0c3e863ebdf5f2408ee1670" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."applicationId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_8eb0871eb31b4f559100a6e01a6" UNIQUE ("applicationId")`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_8eb0871eb31b4f559100a6e01a6" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_8eb0871eb31b4f559100a6e01a6"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_8eb0871eb31b4f559100a6e01a6"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."applicationId" IS NULL`);
        await queryRunner.query(`DROP TABLE "application"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "applicationId" TO "teamId"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_1e89f1fd137dc7fea7242377e25" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
