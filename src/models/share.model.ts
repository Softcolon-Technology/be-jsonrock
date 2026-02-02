import mongoose, { Schema, Document } from 'mongoose'

export type JsonShareMode = 'visualize' | 'tree' | 'formatter'
export type ShareAccessType = 'editor' | 'viewer'
export type ShareType = 'json' | 'text'

export interface IShareLink extends Document {
  slug: string
  type: ShareType
  json: string
  mode: JsonShareMode
  isPrivate: boolean
  accessType: ShareAccessType
  passwordHash?: string
  createdAt: Date
  updatedAt: Date
}

const ShareLinkSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ['json', 'text'], default: 'json' },
    json: { type: String },
    mode: {
      type: String,
      enum: ['visualize', 'tree', 'formatter'],
      required: true,
    },
    isPrivate: { type: Boolean, default: false },
    accessType: { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
    passwordHash: { type: String },
  },
  { timestamps: true }
)

// TTL Index for 30 days
ShareLinkSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
)

export default mongoose.model<IShareLink>(
  'ShareLink',
  ShareLinkSchema,
  'share_links'
)
