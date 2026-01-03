import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "../services/utils/bcrypt";

export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

export interface UserDocument extends Document {
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string | null;
  role: UserRole;
  isOnlineVisible?: boolean;
  readReceipts?: boolean;
  isSuspended: boolean;
  suspendedUntil?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(value: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, trim: true, unique: true, sparse: true, lowercase: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: { type: String, default: null },
    isOnlineVisible: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        if (ret) {
          delete (ret as any).password;
        }
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await hashValue(this.password);
  }
  next();
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
