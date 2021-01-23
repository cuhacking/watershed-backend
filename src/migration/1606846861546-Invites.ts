import {MigrationInterface, QueryRunner} from "typeorm";

export class Invites1606846861546 implements MigrationInterface {
    name = 'Invites1606846861546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "team_invite" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "teamId" integer, "userId" integer, CONSTRAINT "PK_deb3080b1edfad7d043d6db876e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "teamId" integer`);
        await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "FK_dec64033827ee287d0863a1b180" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "FK_e937588d930a6b5fd66958b75f5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_1e89f1fd137dc7fea7242377e25" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_1e89f1fd137dc7fea7242377e25"`);
        await queryRunner.query(`ALTER TABLE "team_invite" DROP CONSTRAINT "FK_e937588d930a6b5fd66958b75f5"`);
        await queryRunner.query(`ALTER TABLE "team_invite" DROP CONSTRAINT "FK_dec64033827ee287d0863a1b180"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "teamId"`);
        await queryRunner.query(`DROP TABLE "team"`);
        await queryRunner.query(`DROP TABLE "team_invite"`);
    }

}
