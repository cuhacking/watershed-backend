import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToOne} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

import {User} from './User';

const REQUIRED_FIELDS = ['firstName', 'lastName', 'studyLevel', 'school', 'hackathonNumber', 
                        'eventsNumber', 'resumePath', 'question1', 'question2', 'question3', 'willingToInterview', 'country'];

export const isApplicationComplete = (app: Application): boolean => {
    return REQUIRED_FIELDS.every(field => app[field as keyof Application] != null);
}
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
    school?: string;
    
    @Column({nullable: true})
    studyLevel?: string;

    @Column({nullable: true})
    program?: string;

    @Column({nullable: true})
    question1?: string;

    @Column({nullable: true})
    question2?: string;

    @Column({nullable: true})
    question3?: string;

    @Column({nullable: true})
    hackathonNumber?: number;

    @Column({nullable: true})
    eventsNumber?: number;

    @Column({nullable: true})
    website?: string;

    @Column({nullable: true})
    github?: string;

    @Column({nullable: true})
    linkedin?: string;

    @Column({nullable: true})
    skills?: string;

    @Column({nullable: true})
    other?: string;

    @Column({nullable: true})
    country?: string;

    @Column({nullable: true})
    willingToInterview?: boolean;
    
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