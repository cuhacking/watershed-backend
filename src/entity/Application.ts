import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

import {User} from './User';

@Entity()
export class Application {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    completed!: boolean;

    @Column({nullable: true})
    firstName?: string;

    @Column({nullable: true})
    lastName?: string;

    @Column({nullable: true})
    pronouns?: string;

    @Column({nullable: true})
    email?: string;

    @Column({nullable: true})
    levelOfStudy?: string;

    @Column({nullable: true})
    program?: string;

    @Column({nullable: true})
    shortAnswer1?: string;

    @Column({nullable: true})
    shortAnswer2?: string;

    @Column({nullable: true})
    shortAnswer3?: string;

    @Column({nullable: true})
    numHackathons?: number;

    @Column({nullable: true})
    personalSiteUrl?: string;

    // Stores the path to their resume
    @Column({nullable: true})
    resumePath?: string;

    // Stores the uploaded name of their resume
    @Column({nullable: true})
    resumeName?: string;

    @OneToOne(() => User, user => user.application, {cascade: true})
    user!: User;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}