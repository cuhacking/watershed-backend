import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn, ManyToMany} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';

@Entity()
export class Submission {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    projectName!: string;

    @Column()
    repo!: string;

    @Column()
    imageLogo!: string;

    @Column()
    imageCover!: string;

    @Column()
    readmePath!: string;

    @Column()
    demoVideo!: string;

    // TODO: Many-to-many relation with Challenges
    //@ManyToMany()
    //???

    // TODO: One-to-one relation to Team
    //@OneToOne(() => createEmailTemplate, team => team.submission, {cascade: true})
    //team!: Team;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}