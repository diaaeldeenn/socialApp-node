import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../enum/multer.enum.js";
import fs from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export class S3Service {
    client;
    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile({ ACL = ObjectCannedACL.public_read_write, path = "General", file, storeType = Store_Enum.memory }) {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            ACL,
            Key: `socialMedia_app/${path}/${randomUUID()}_____${file.originalname}`,
            Body: storeType === Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
            ContentType: file.mimetype
        });
        await this.client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ ACL = ObjectCannedACL.public_read_write, path = "General", file, storeType = Store_Enum.disk }) {
        const command = new Upload({
            client: this.client,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media/${path}/${randomUUID()}_____${file.originalname}`,
                Body: storeType === Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
                ContentType: file.mimetype
            }
        });
        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        return result.Key;
    }
    async uploadFiles({ ACL = ObjectCannedACL.public_read_write, path = "General", files, storeType = Store_Enum.memory, isLarge = false }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, storeType, path, ACL });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, storeType, path, ACL });
            }));
        }
        return urls;
    }
    async creatPreSignedUrl({ path, fileName, ContentType, expiresIn = 60 }) {
        const Key = `social_media/${path}/${randomUUID()}_____${fileName}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key,
            ContentType
        });
        const url = await getSignedUrl(this.client, command, { expiresIn });
        return { url, Key };
    }
    async getPreSignedUrl({ Key, expiresIn = 60 }) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key,
        });
        const url = await getSignedUrl(this.client, command, { expiresIn });
        return url;
    }
    async getFile(Key) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key
        });
        return await this.client.send(command);
    }
    async getFiles(folderName) {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: `socialMedia_app/${folderName}`
        });
        return await this.client.send(command);
    }
    async deleteFile(Key) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key
        });
        return await this.client.send(command);
    }
    async deleteFiles(Keys) {
        const keyMapped = Keys.map((Key) => {
            return { Key };
        });
        const command = new DeleteObjectsCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: keyMapped
            }
        });
        return await this.client.send(command);
    }
    async deleteFolder(folderName) {
        const data = await this.getFiles(folderName);
        const keyMapped = data.Contents?.map((Key) => {
            return Key.Key;
        });
        return await this.deleteFiles(keyMapped);
    }
}
