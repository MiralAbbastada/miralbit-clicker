'use client'

import React, { useState, useEffect } from 'react';
import './App.css';
import Hamster from './icons/Hamster';
import Heart from './images/ht.png';
import { mainCharacter } from './images';
import Settings from './icons/Settings';
import Friends from './icons/Friends';
import Coins from './icons/Coins';
import WebApp from '@twa-dev/sdk';

// Интерфейс для данных пользователя
interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_premium?: boolean;
}

// API URL для работы с пользователями и монетами
const API_URL = 'http://localhost:5000';

// Получение или создание пользователя
const getOrCreateUser = async (userData: UserData) => {
  try {
    const response = await fetch(`${API_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_premium: userData.is_premium,
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка при создании пользователя');
    }

    const data = await response.json();
    return data.coins; // Возвращаем сохраненные монеты
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    return null;
  }
};

// Обновление монет пользователя
const updateUserCoins = async (userId: number, coins: number) => {
  try {
    const response = await fetch(`${API_URL}/updateCoins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        coins: coins,
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка при обновлении монет');
    }
  } catch (error) {
    console.error('Ошибка при обновлении монет:', error);
  }
};

const App: React.FC = () => {
  const levelNames = [
    "Bronze",    // From 0 to 4999 coins
    "Silver",    // From 5000 coins to 24,999 coins
    "Gold",      // From 25,000 coins to 99,999 coins
    "Platinum",  // From 100,000 coins to 999,999 coins
    "Diamond",   // From 1,000,000 coins to 2,000,000 coins
    "Epic",      // From 2,000,000 coins to 10,000,000 coins
    "Legendary", // From 10,000,000 coins to 50,000,000 coins
    "Master",    // From 50,000,000 coins to 100,000,000 coins
    "GrandMaster", // From 100,000,000 coins to 1,000,000,000 coins
    "Dungeon Master"       // From 1,000,000,000 coins to ∞
  ];

  const levelMinPoints = [
    0,        // Bronze
    5000,     // Silver
    25000,    // Gold
    100000,   // Platinum
    1000000,  // Diamond
    2000000,  // Epic
    10000000, // Legendary
    50000000, // Master
    100000000,// GrandMaster
    1000000000// DungeonMaster
  ];

  const [levelIndex, setLevelIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const pointsToAdd = 5;
  const profitPerHour = 593043;

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Инициализация данных Telegram WebApp
    if (WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user as UserData;
      setUserData(user);

      // Получаем или создаем пользователя и устанавливаем его монеты
      getOrCreateUser(user).then((savedCoins) => {
        if (savedCoins !== null) {
          setPoints(savedCoins);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (userData) {
      // Сохраняем обновленные монеты при изменении points
      updateUserCoins(userData.id, points);
    }
  }, [points, userData]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${-y / 15}deg) rotateY(${x / 15}deg)`;
    setTimeout(() => {
      card.style.transform = '';
    }, 100);

    setPoints(points + pointsToAdd);
    setClicks([...clicks, { id: Date.now(), x: e.pageX, y: e.pageY }]);
  };

  const handleAnimationEnd = (id: number) => {
    setClicks((prevClicks) => prevClicks.filter(click => click.id !== id));
  };

  const calculateProgress = () => {
    if (levelIndex >= levelNames.length - 1) {
      return 100;
    }
    const currentLevelMin = levelMinPoints[levelIndex];
    const nextLevelMin = levelMinPoints[levelIndex + 1];
    const progress = ((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progress, 100);
  };

  useEffect(() => {
    const currentLevelMin = levelMinPoints[levelIndex];
    const nextLevelMin = levelMinPoints[levelIndex + 1];
    if (points >= nextLevelMin && levelIndex < levelNames.length - 1) {
      setLevelIndex(levelIndex + 1);
    } else if (points < currentLevelMin && levelIndex > 0) {
      setLevelIndex(levelIndex - 1);
    }
  }, [points, levelIndex, levelMinPoints, levelNames.length]);

  const formatProfitPerHour = (profit: number) => {
    if (profit >= 1000000000) return `+${(profit / 1000000000).toFixed(2)}B`;
    if (profit >= 1000000) return `+${(profit / 1000000).toFixed(2)}M`;
    if (profit >= 1000) return `+${(profit / 1000).toFixed(2)}K`;
    return `+${profit}`;
  };

  useEffect(() => {
    const pointsPerSecond = Math.floor(profitPerHour / 3600);
    const interval = setInterval(() => {
      setPoints(prevPoints => prevPoints + pointsPerSecond);
    }, 1000);
    return () => clearInterval(interval);
  }, [profitPerHour]);

  return (
    <div className="bg-black flex justify-center">
      <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
        <div className="px-4 z-10">
          <div className="flex items-center space-x-2 pt-4">
            <div className="p-1 rounded-lg bg-[#1d2025]">
              <Hamster size={24} className="text-[#d4d4d4]" />
            </div>
            <div>
              {userData ? (
                <p className="text-sm">
                  {userData.first_name} {userData.last_name} (CEO)
                </p>
              ) : (
                <p className="text-sm">Guest (CEO)</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between space-x-4 mt-1">
            <div className="flex items-center w-1/3">
              <div className="w-full">
                <div className="flex justify-between">
                  <p className="text-sm">{levelNames[levelIndex]}</p>
                  <p className="text-sm">
                    {levelIndex + 1} <span className="text-[#95908a]">/ {levelNames.length}</span>
                  </p>
                </div>
                <div className="flex items-center mt-1 border-2 border-[#43433b] rounded-full">
                  <div className="w-full h-2 bg-[#43433b]/[0.6] rounded-full">
                    <div className="progress-gradient h-2 rounded-full" style={{ width: `${calculateProgress()}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <img src={Heart} alt="Heart" className="h-6 w-6" />
              <p className="text-sm mt-1">{formatProfitPerHour(profitPerHour)}</p>
            </div>
            <div className="flex flex-col items-center">
              <Coins size={24} className="text-[#fbbf24]" />
              <p className="text-sm mt-1">{points}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex-1 flex items-center justify-center">
          <div className="card h-48 w-48 bg-[#27292d]" onClick={handleCardClick}>
            <img src={mainCharacter} alt="Character" className="h-full w-full" />
          </div>
        </div>
        <div className="absolute w-full h-full top-0 left-0 z-0">
          {clicks.map((click) => (
            <div
              key={click.id}
              className="absolute w-10 h-10 bg-white/20 rounded-full animate-ping"
              style={{ left: click.x - 20, top: click.y - 20 }}
              onAnimationEnd={() => handleAnimationEnd(click.id)}
            ></div>
          ))}
        </div>
        <div className="w-full flex justify-around py-4">
          <button>
            <Friends size={24} className="text-[#d4d4d4]" />
          </button>
          <button>
            <Settings size={24} className="text-[#d4d4d4]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
