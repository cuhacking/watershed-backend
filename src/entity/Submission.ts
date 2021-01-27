import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn, ManyToMany, JoinTable} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import {Team} from './Team';
import { Challenge } from './Challenge';
import { joinTeam } from '../controllers/teamController';
@Entity()
export class Submission {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    projectName!: string;

    @Column()
    repo!: string;

    @Column({nullable: true, type: 'bytea'})
    imageLogo?: Buffer;

    @Column({nullable: true, type: 'bytea'})
    imageCover?: Buffer;

    @Column()
    readmePath!: string;

    @Column()
    readmeText!: string;

    @Column()
    demoVideo!: string;

    @OneToOne(() => Team, team => team.submission, {cascade: true})
    team!: Team;

    @ManyToMany(() => Challenge)
    @JoinTable()
    challenges?: Challenge[];

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}