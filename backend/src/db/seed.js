async function seedMatches(pool) {
  const groups = [
    { g: 'A', teams: ['México', 'Sudáfrica', 'Corea del Sur', 'Por definir'] },
    { g: 'B', teams: ['Canadá', 'Catar', 'Suiza', 'Por definir'] },
    { g: 'C', teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
    { g: 'D', teams: ['Estados Unidos', 'Paraguay', 'Australia', 'Por definir'] },
    { g: 'E', teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
    { g: 'F', teams: ['Países Bajos', 'Japón', 'Por definir', 'Túnez'] },
    { g: 'G', teams: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
    { g: 'H', teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
    { g: 'I', teams: ['Francia', 'Senegal', 'Por definir', 'Noruega'] },
    { g: 'J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
    { g: 'K', teams: ['Portugal', 'Por definir', 'Uzbekistán', 'Colombia'] },
    { g: 'L', teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
  ];

  let order = 0;
  const baseDate = new Date('2026-06-11T19:00:00Z');

  for (const { g, teams } of groups) {
    const fixtures = [
      [teams[0], teams[1]],
      [teams[2], teams[3]],
      [teams[0], teams[2]],
      [teams[1], teams[3]],
      [teams[0], teams[3]],
      [teams[1], teams[2]],
    ];
    for (let i = 0; i < fixtures.length; i++) {
      const [home, away] = fixtures[i];
      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + Math.floor(order / 4));
      matchDate.setHours(19 + (order % 3) * 3);
      await pool.query(
        `INSERT INTO matches (phase, stage, round, home_team, away_team, match_date, status, match_order)
         VALUES (1, 'Fase de Grupos', $1, $2, $3, $4, 'upcoming', $5)`,
        [`Grupo ${g}`, home, away, matchDate, order++]
      );
    }
  }

  const knockoutRounds = [
    { round: 'Ronda de 32', count: 16, stage: 'Eliminatorias' },
    { round: 'Ronda de 16', count: 8, stage: 'Eliminatorias' },
    { round: 'Cuartos de Final', count: 4, stage: 'Eliminatorias' },
    { round: 'Semifinal', count: 2, stage: 'Eliminatorias' },
    { round: 'Tercer Puesto', count: 1, stage: 'Eliminatorias' },
    { round: 'Final', count: 1, stage: 'Eliminatorias' },
  ];

  let koOrder = order;
  for (const { round, count, stage } of knockoutRounds) {
    for (let i = 1; i <= count; i++) {
      const matchDate = new Date('2026-07-01T19:00:00Z');
      matchDate.setDate(matchDate.getDate() + Math.floor(koOrder / 2));
      await pool.query(
        `INSERT INTO matches (phase, stage, round, home_team, away_team, match_date, status, match_order)
         VALUES (1, $1, $2, $3, $4, $5, 'locked', $6)`,
        [
          stage,
          round,
          `Gan. R${String(i).padStart(2, '0')}A`,
          `Gan. R${String(i).padStart(2, '0')}B`,
          matchDate,
          koOrder++,
        ]
      );
    }
  }

  // Phase 2: copy structure with placeholder teams for second half of tournament
  const p2Groups = groups.slice(0, 6);
  let p2Order = 1000;
  for (const { g, teams } of p2Groups) {
    const fixtures = [
      [teams[0], teams[1]],
      [teams[2], teams[3]],
    ];
    for (const [home, away] of fixtures) {
      await pool.query(
        `INSERT INTO matches (phase, stage, round, home_team, away_team, match_date, status, match_order)
         VALUES (2, 'Fase de Grupos', $1, $2, $3, $4, 'upcoming', $5)`,
        [`Grupo ${g}`, home, away, new Date('2026-07-15T19:00:00Z'), p2Order++]
      );
    }
  }

  const p2Knockout = [
    { round: 'Cuartos de Final', count: 4 },
    { round: 'Semifinal', count: 2 },
    { round: 'Final', count: 1 },
  ];
  for (const { round, count } of p2Knockout) {
    for (let i = 1; i <= count; i++) {
      await pool.query(
        `INSERT INTO matches (phase, stage, round, home_team, away_team, match_date, status, match_order)
         VALUES (2, 'Eliminatorias', $1, $2, $3, $4, 'locked', $5)`,
        [round, `Gan. P2-${i}A`, `Gan. P2-${i}B`, new Date('2026-07-20T19:00:00Z'), p2Order++]
      );
    }
  }
}

module.exports = { seedMatches };
