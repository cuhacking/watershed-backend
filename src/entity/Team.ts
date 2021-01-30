import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, OneToMany, OneToOne, JoinColumn} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import {User} from './User';
import {TeamInvite} from './TeamInvite';
import {Submission} from './Submission';

@Entity()
export class Team {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    uuid!: string;

    @Column()
    @IsDefined()
    name?: string;

    @OneToMany(() => User, user => user.team, {cascade: true, eager: true})
    members!: User[];

    @OneToMany(() => TeamInvite, invite => invite.team, {cascade: true})
    invites!: TeamInvite[];

    @OneToOne(() => Submission, submission => submission.team)
    @JoinColumn()
    submission?: Submission;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}