import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from './entities/database.entity';
import { Permission } from './entities/permission.entity';
import { CommunityDbService } from '../storage/community-db.service';
import { randomUUID as uuid } from 'crypto';
import {
  DatabaseRole,
  canDeleteDatabase,
  canModifySchema,
  canEditData,
  canManagePermissions,
} from '../common/types/database-role.enum';

@Injectable()
export class DatabasesService {
  constructor(
    @InjectRepository(Database)
    private readonly databaseRepository: Repository<Database>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly communityDbService: CommunityDbService,
  ) {}

  async create(
    userId: string,
    name: string,
    description?: string,
  ): Promise<Database> {
    const dbId = uuid();

    const database = this.databaseRepository.create({
      id: dbId,
      name,
      description,
      createdBy: userId,
    });

    await this.databaseRepository.save(database);

    const permission = this.permissionRepository.create({
      id: uuid(),
      userId,
      databaseId: dbId,
      role: DatabaseRole.OWNER,
      grantedBy: userId,
    });

    await this.permissionRepository.save(permission);

    await this.communityDbService.initializeDatabase(dbId);

    return database;
  }

  async findAllForUser(userId: string): Promise<Database[]> {
    const permissions = await this.permissionRepository.find({
      where: { userId },
      relations: ['database'],
    });

    return permissions.map((p) => p.database);
  }

  async findById(databaseId: string): Promise<Database> {
    const database = await this.databaseRepository.findOne({
      where: { id: databaseId },
    });

    if (!database) {
      throw new NotFoundException(`Database with id ${databaseId} not found`);
    }

    return database;
  }

  async findByIdWithAccess(
    databaseId: string,
    userId: string,
  ): Promise<{ database: Database; role: DatabaseRole }> {
    const database = await this.findById(databaseId);
    const role = await this.getUserRole(databaseId, userId);

    if (!role) {
      throw new ForbiddenException('Access denied to this database');
    }

    return { database, role };
  }

  async update(
    databaseId: string,
    userId: string,
    updates: { name?: string; description?: string },
  ): Promise<Database> {
    const { database, role } = await this.findByIdWithAccess(
      databaseId,
      userId,
    );

    if (!canModifySchema(role)) {
      throw new ForbiddenException(
        'Only owners and admins can update database metadata',
      );
    }

    if (updates.name) {
      database.name = updates.name;
    }

    if (updates.description !== undefined) {
      database.description = updates.description;
    }

    return await this.databaseRepository.save(database);
  }

  async remove(databaseId: string, userId: string): Promise<void> {
    const { database, role } = await this.findByIdWithAccess(
      databaseId,
      userId,
    );

    if (!canDeleteDatabase(role)) {
      throw new ForbiddenException('Only database owner can delete it');
    }

    await this.permissionRepository.delete({ databaseId });

    await this.databaseRepository.remove(database);

    await this.communityDbService.closeConnection(databaseId);

    // TODO: Видалити файл БД (опціонально, можна залишити для backup)
    // const dbPath = getCommunityDbPath(databaseId);
    // await fs.unlink(dbPath);
  }

  async grantPermission(
    databaseId: string,
    granterId: string,
    targetUserId: string,
    role: DatabaseRole,
  ): Promise<Permission> {
    const { role: granterRole } = await this.findByIdWithAccess(
      databaseId,
      granterId,
    );

    if (!canManagePermissions(granterRole)) {
      throw new ForbiddenException(
        'Only owners and admins can manage permissions',
      );
    }

    if (role === DatabaseRole.OWNER) {
      throw new ForbiddenException('Admins cannot grant owner role');
    }

    const existing = await this.permissionRepository.findOne({
      where: { databaseId, userId: targetUserId },
    });

    if (existing) {
      throw new ConflictException('User already has access to this database');
    }

    const permission = this.permissionRepository.create({
      id: uuid(),
      userId: targetUserId,
      databaseId,
      role,
      grantedBy: granterId,
    });

    return await this.permissionRepository.save(permission);
  }

  async revokePermission(
    databaseId: string,
    revokerId: string,
    targetUserId: string,
  ): Promise<void> {
    const { role: revokerRole } = await this.findByIdWithAccess(
      databaseId,
      revokerId,
    );

    if (!canManagePermissions(revokerRole)) {
      throw new ForbiddenException('Only owners can revoke permissions');
    }

    const permission = await this.permissionRepository.findOne({
      where: { databaseId, userId: targetUserId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission.role === DatabaseRole.OWNER) {
      throw new ForbiddenException('Cannot revoke owner permissions');
    }

    await this.permissionRepository.remove(permission);
  }

  async getUserRole(
    databaseId: string,
    userId: string,
  ): Promise<DatabaseRole | null> {
    const permission = await this.permissionRepository.findOne({
      where: { databaseId, userId },
    });

    return permission?.role ?? null;
  }

  async getPermissions(
    databaseId: string,
    userId: string,
  ): Promise<Permission[]> {
    await this.findByIdWithAccess(databaseId, userId);

    return await this.permissionRepository.find({
      where: { databaseId },
      relations: ['user'],
    });
  }

  async getUserPermissions(
    databaseId: string,
    userId: string,
  ): Promise<Permission | null> {
    await this.findByIdWithAccess(databaseId, userId);

    return await this.permissionRepository.findOne({
      where: { databaseId, userId },
      relations: ['user'],
    });
  }

  async hasAccess(databaseId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(databaseId, userId);
    return role !== null;
  }

  async canModifySchema(databaseId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(databaseId, userId);
    return role ? canModifySchema(role) : false;
  }

  async canEditData(databaseId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(databaseId, userId);
    return role ? canEditData(role) : false;
  }
}
