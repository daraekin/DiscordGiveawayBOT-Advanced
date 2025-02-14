const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'giveaway.sqlite'),
  logging: false,
});

const Giveaway = sequelize.define('Giveaway', {
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  creatorId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  controlChannelId: {
    type: DataTypes.STRING,
  },
  targetChannelId: {
    type: DataTypes.STRING,
  },
  messageId: {
    type: DataTypes.STRING,
  },
  prize: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.BIGINT,
  },
  endTime: {
    type: DataTypes.BIGINT,
  },
  winnerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requiredRoles: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('requiredRoles');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(val) {
      this.setDataValue('requiredRoles', JSON.stringify(val));
    }
  },
  excludedRoles: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('excludedRoles');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(val) {
      this.setDataValue('excludedRoles', JSON.stringify(val));
    }
  },
  winners: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('winners');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(val) {
      this.setDataValue('winners', JSON.stringify(val));
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'inactive',
  },
  participantCount: { // Add this line
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
});

const Participant = sequelize.define('Participant', {
  giveawayId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  joinedAt: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['giveawayId', 'userId']
    }
  ]
});

const Log = sequelize.define('Log', {
  giveawayId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  }
}, {
  timestamps: false,
});

const Archive = sequelize.define('Archive', {
  giveawayId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  archiveData: {
    type: DataTypes.TEXT,
  },
  archivedAt: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  }
}, {
  timestamps: false,
});

const Blacklist = sequelize.define('Blacklist', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  reason: {
    type: DataTypes.STRING,
  },
  addedAt: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  }
}, {
  timestamps: false,
});

module.exports = { sequelize, Giveaway, Participant, Log, Archive, Blacklist };