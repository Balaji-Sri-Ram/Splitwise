const prisma = require('../utils/db');
const balanceService = require('../services/balanceService');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, icon, memberEmails } = req.body;
    const userId = req.user.userId;

    // Find users by their emails if memberEmails are provided
    let additionalMembers = [];
    if (memberEmails && Array.isArray(memberEmails) && memberEmails.length > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: memberEmails } }
      });
      // Filter out the creator in case they added their own email
      additionalMembers = users
        .filter(u => u.id !== userId)
        .map(u => ({ userId: u.id }));
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        icon,
        createdBy: userId,
        members: {
          create: [
            { userId: userId }, // The creator
            ...additionalMembers
          ]
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.status(201).json(group);

    if (req.io) {
      req.io.emit('new_group');
    }
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

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId } } }
    });

    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    for (const group of groups) {
      const balances = await balanceService.calculateBalances(group.id);
      for (const debt of balances) {
        if (debt.fromUser?.id === userId) {
          totalYouOwe += debt.amount;
        } else if (debt.toUser?.id === userId) {
          totalOwedToYou += debt.amount;
        }
      }
    }

    res.status(200).json({
      groupsCount: groups.length,
      totalOwedToYou,
      totalYouOwe
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    const userId = req.user.userId;

    // Check if user is part of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const group = await prisma.group.update({
      where: { id },
      data: { name, description, icon }
    });

    res.status(200).json(group);

    if (req.io) {
      req.io.emit('new_group'); // Emit global event to trigger refresh
    }
  } catch (error) {
    console.error('Update Group Error:', error);
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

exports.getBalances = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is part of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.user.userId } }
    });
    
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const balances = await balanceService.calculateBalances(id);
    res.status(200).json(balances);
  } catch (error) {
    console.error('Get Balances Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
