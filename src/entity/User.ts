import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, ManyToOne, OneToMany, OneToOne, JoinColumn} from 'typeorm';
import { validateOrReject, IsDefined, registerDecorator, ValidationArguments } from 'class-validator';
import { Team } from './Team';
import { TeamInvite } from './TeamInvite';

import {Application} from './Application';
import {RavensQuest} from './RavensQuest';

export enum Role {
    Hacker,
    Sponsor,
    Organizer
}

function ValidRole() {
    return function (object: User, propertyName: string) {
      registerDecorator({
        name: 'validRole',
        target: object.constructor,
        propertyName: propertyName,
        validator: {
          validate(value: any, args: ValidationArguments) {
              return Object.values(Role).includes(value);
          },
        },
      });
    };
  }
@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    uuid!: string;

    @Column({unique: true})
    @IsDefined()
    email!: string;

    @Column({nullable: true, type: 'varchar'})
    password?: string | null;

    @Column({nullable: true, type: 'int4'})
    @ValidRole()
    role?: Role | null;

    @Column({nullable: true, type: 'varchar'})
    discordId?: string | null;

    @Column({nullable: true, type: 'varchar'})
    githubId?: string | null;

    @ManyToOne(() => Team, team => team.members)
    team?: Team;

    @OneToMany(() => TeamInvite, invite => invite.user)
    teamInvites?: TeamInvite[];

    @Column({nullable: true, type: 'varchar'})
    discordUsername?: string | null;

    @OneToOne(() => Application, app => app.user)
    @JoinColumn()
    application?: Application | null;

    @OneToOne(() => RavensQuest, rq => rq.user)
    @JoinColumn()
    ravensQuestProgress?: RavensQuest | null;

    @Column({type: 'boolean', default: false})
    @IsDefined()
    confirmed!: boolean;

    // Note: to avoid dealing with big schema changes, I'm allowing null to be the same as false
    @Column({nullable: true, type: 'boolean'})
    checkedIn?: boolean | null;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}