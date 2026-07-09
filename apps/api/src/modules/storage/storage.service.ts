import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';
import { randomUUID } from 'crypto';

type UploadUrlResult = { uploadUrl: string; publicUrl: string; key: string };

/**
 * Abstração de storage com dois back-ends possíveis, escolhidos por
 * STORAGE_PROVIDER:
 *
 *  - "r2" | "s3"        → Cloudflare R2 / AWS S3 / qualquer serviço
 *                          S3-compatível (via STORAGE_ENDPOINT).
 *  - "azure-blob"        → Azure Blob Storage (Storage Account criado pelo
 *                          Bicep em infra/azure/resources.bicep).
 *
 * Em ambos os casos, o método getUploadUrl() devolve uma URL pré-assinada
 * (SAS no caso do Azure) para o cliente fazer upload direto — o ficheiro
 * nunca passa pela API.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider = (process.env.STORAGE_PROVIDER ?? 'r2').toLowerCase();
  private readonly bucket = process.env.STORAGE_BUCKET ?? 'biblia-ao-resources';
  private readonly publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL ?? '';

  // --- Cliente S3 (r2 / s3) ---
  private readonly s3Client = new S3Client({
    region: process.env.STORAGE_REGION ?? 'auto',
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
    },
  });

  // --- Cliente Azure Blob Storage ---
  private readonly azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME ?? '';
  private readonly azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY ?? '';
  private readonly azureCredential =
    this.azureAccountName && this.azureAccountKey
      ? new StorageSharedKeyCredential(this.azureAccountName, this.azureAccountKey)
      : undefined;
  private readonly blobServiceClient =
    this.azureCredential
      ? new BlobServiceClient(
          `https://${this.azureAccountName}.blob.core.windows.net`,
          this.azureCredential,
        )
      : undefined;

  async getUploadUrl(category: string, fileName: string, mimeType: string): Promise<UploadUrlResult> {
    const key = `${category}/${randomUUID()}-${fileName}`;

    if (this.provider === 'azure-blob') {
      return this.getAzureUploadUrl(key, mimeType);
    }
    return this.getS3UploadUrl(key, mimeType);
  }

  async deleteObject(key: string): Promise<void> {
    if (this.provider === 'azure-blob') {
      if (!this.blobServiceClient) throw new Error('Azure Blob Storage não configurado (AZURE_STORAGE_ACCOUNT_NAME/KEY em falta).');
      const containerClient = this.blobServiceClient.getContainerClient(this.bucket);
      await containerClient.getBlockBlobClient(key).deleteIfExists();
      return;
    }
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private async getS3UploadUrl(key: string, mimeType: string): Promise<UploadUrlResult> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    const publicUrl = `${this.publicBaseUrl}/${key}`;
    return { uploadUrl, publicUrl, key };
  }

  private async getAzureUploadUrl(key: string, mimeType: string): Promise<UploadUrlResult> {
    if (!this.blobServiceClient || !this.azureCredential) {
      throw new Error(
        'Azure Blob Storage não configurado. Defina AZURE_STORAGE_ACCOUNT_NAME e AZURE_STORAGE_ACCOUNT_KEY no .env ' +
          '(ver output "storageAccountName" do Bicep em infra/azure).',
      );
    }

    const containerClient = this.blobServiceClient.getContainerClient(this.bucket);
    await containerClient.createIfNotExists({ access: 'blob' });
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const expiresOn = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.bucket,
        blobName: key,
        permissions: BlobSASPermissions.parse('cw'), // create + write
        startsOn: new Date(),
        expiresOn,
        protocol: SASProtocol.Https,
        contentType: mimeType,
      },
      this.azureCredential,
    ).toString();

    const uploadUrl = `${blockBlobClient.url}?${sas}`;
    const publicUrl = this.publicBaseUrl ? `${this.publicBaseUrl}/${key}` : blockBlobClient.url;
    return { uploadUrl, publicUrl, key };
  }

  /** Tipos de ficheiro permitidos por categoria — validação básica contra upload malicioso. */
  static readonly ALLOWED_MIME_TYPES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    imagem: ['image/png', 'image/jpeg', 'image/webp'],
    audio: ['audio/mpeg', 'audio/mp4', 'audio/wav'],
    video: ['video/mp4', 'video/webm'],
    slide: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ],
  };
}
