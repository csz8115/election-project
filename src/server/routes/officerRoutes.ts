import db from '../utils/db.ts';
import express from 'express';
import { z } from 'zod';
import { User } from '../types/user.ts';
import { getRedisClient } from '../utils/redis.ts';
import { getHttpStats, getDbStats } from '../utils/systemStats.ts';
import bcrypt from 'bcrypt'

