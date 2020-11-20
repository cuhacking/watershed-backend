/**
 * Model storing state parameters passed to OAuth flows (e.g. GitHub/Discord auth)
 * States are one-time use nonces used to prevent CSRF attacks: https://auth0.com/docs/protocols/state-parameters#csrf-attacks
 * States should be comprised of some crypto-secure random string and optionally additional info such as uuids.
 * A state should only be valid for a single service for a single use.
 */

import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

type stateType = 'github' | 'discord'; 

@Entity()
export class State {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    state!: string;

    // Github or Discord
    @Column()
    @IsDefined()
    type!: stateType;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}