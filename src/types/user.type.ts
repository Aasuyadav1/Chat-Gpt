'use server';
import { Document } from "mongoose";

export interface userType extends Document {
  name: string;
  email: string;
  image: string;
}