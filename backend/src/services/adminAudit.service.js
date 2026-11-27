export const runAuditedAdminAction = async ({
  mongoose,
  AuditLogModel,
  admin,
  organization,
  action,
  entityType,
  entityId,
  previousStatus,
  newStatus,
  reason,
  fieldsChanged = [],
  operation,
}) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      result = await operation(session);
      if (!result) {
        throw Object.assign(new Error("Admin action could not be completed"), {
          statusCode: 409,
        });
      }

      await AuditLogModel.create(
        [
          {
            admin: admin._id,
            organization: organization || undefined,
            action,
            entityType,
            entityId,
            previousStatus: previousStatus ?? null,
            newStatus: newStatus ?? null,
            reason: reason || undefined,
            fieldsChanged,
          },
        ],
        { session }
      );
    });

    return result;
  } finally {
    await session.endSession();
  }
};
