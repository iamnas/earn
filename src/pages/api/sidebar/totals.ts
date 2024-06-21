import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userCount = await prisma.user.count();

    const bountiesCount = await prisma.bounties.count({
      where: {
        isPublished: true,
      },
    });

    const totalRewardAmountResult = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: 'OPEN',
      },
    });

    let errorCount = 0;

    if (process.env.NODE_ENV === 'production') {
      errorCount = 289;
    }

    const roundedUserCount = Math.ceil((userCount - errorCount) / 10) * 10;

    const totalRewardAmount = totalRewardAmountResult._sum.usdValue || 0;

    const roundedTotalRewardAmount = Math.ceil(totalRewardAmount / 10) * 10;

    return res.status(200).json({
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
      totalUsers: roundedUserCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'An error occurred while fetching the total reward amount',
    });
  }
}
