const prisma = require('../utils/db');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const userId = req.user.userId;

    const group = await prisma.group.create({
      data: {
        name,
        description,
        icon,
        createdBy: userId,
        members: {
          create: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create Group Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error('Get Groups Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body; // user to add by email

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already in group
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: userToAdd.id }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already in the group' });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: userToAdd.id
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
