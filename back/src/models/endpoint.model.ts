import { Schema, model, InferSchemaType, Types } from 'mongoose';

const endpointSchema = new Schema({
    url: { type: String, required: true },
    method: { type: String, required: true },
    price: { type: String, required: true },
    network: { type: String, required: true },
    config: {
        description: { type: String },
        inputSchema: { type: Schema.Types.Mixed },
        outputSchema: { type: Schema.Types.Mixed },
    }
}, {
    timestamps: true,
});

export type Endpoint = InferSchemaType<typeof endpointSchema> & { _id: Types.ObjectId };

export const EndpointModel = model('Endpoint', endpointSchema);