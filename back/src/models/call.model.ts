import { Schema, model, InferSchemaType, Types } from 'mongoose';

const callSchema = new Schema({
    sourceChainName: { type: String, required: true },
    destinationChainName: { type: String, required: true },
    sourcePaymentStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], required: false },
    sourcePaymentTxHash: { type: String, required: false },
    verifyStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], required: false },
    verifyHash: { type: String, required: false },
    relayStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], required: false },
    relayHash: { type: String, required: false },
    executionStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], required: false },
    executionHash: { type: String, required: false },
    destPaymentStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], required: false },
    destPaymentTxHash: { type: String, required: false },
    xPaymentResponse: { type: Schema.Types.Mixed, required: false },
    bodyResponse: { type: Schema.Types.Mixed, required: false }
}, {
    timestamps: true,
});

export type Call = InferSchemaType<typeof callSchema> & { _id: Types.ObjectId };

export const CallModel = model('Call', callSchema);