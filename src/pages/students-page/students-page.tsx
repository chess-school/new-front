// src/pages/students-page/students-page.tsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useTranslation } from "react-i18next";
import { notification } from 'antd'; // Используем Antd notification для консистентности

// 1. Импортируем наши новые API-функции
import { 
  getStudentIdsByCoach, 
  getStudentDetails, 
  removeStudentFromCoach 
} from '@/api/coaches';

import { Student } from '@/types/Student'; // Импортируем тип
import EditScheduleModal from '../../components/Schedule/EditScheduleModal';

export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Добавим состояние загрузки

  // 2. Используем useMemo для безопасного получения email
  const coachEmail = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr).email : null;
  }, []);

  // 3. Оборачиваем логику загрузки в useCallback
  const fetchStudents = useCallback(async () => {
    if (!coachEmail) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Шаг 1: Получаем ID всех студентов
      const studentIds = await getStudentIdsByCoach(coachEmail);

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        setStudents([]);
        return;
      }

      // Шаг 2: Параллельно запрашиваем детали по каждому ID
      // Стало (правильно)
      const studentDetailsPromises = studentIds.map(id => getStudentDetails(coachEmail, id));
      const studentDetails = await Promise.all(studentDetailsPromises);
      
      // Отфильтровываем тех, по кому не удалось получить данные (null)
      setStudents(studentDetails.filter((student): student is Student => student !== null));

    } catch (error) {
      console.error('Ошибка при получении списка учеников:', error);
      notification.error({
        message: t('studentsPage.fetchError'),
        description: undefined
      });
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachEmail, t]);


  // 4. Логика удаления ученика
  const handleRemoveStudent = async (studentId: string) => {
    if (!coachEmail) return;

    try {
      await removeStudentFromCoach(coachEmail, studentId);
      notification.success({
        message: t('studentsPage.studentDeletedSuccess'),
        description: undefined
      });
      // Обновляем список учеников, отфильтровывая удаленного локально для быстрого UI
      setStudents(prevStudents => prevStudents.filter(s => s._id !== studentId));
    } catch (error) {
      console.error('Ошибка при удалении ученика:', error);
      // Ошибка уже должна показываться интерсептором axios
    }
  };

  const handleEditSchedule = (student: Student) => {
    setSelectedStudent(student);
    setOpenModal(true);
  };
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {t("studentsPage.studentsListTitle")}
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("studentsPage.firstName")}</TableCell>
              <TableCell>{t("studentsPage.lastName")}</TableCell>
              <TableCell>{t("studentsPage.email")}</TableCell>
              <TableCell align="right">{t("studentsPage.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">{t('common.loading')}</TableCell>
              </TableRow>
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>{student.firstName}</TableCell>
                  <TableCell>{student.lastName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleEditSchedule(student)}
                      style={{ marginRight: 10 }}
                    >
                      {t("studentsPage.editSchedule")}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleRemoveStudent(student._id)}
                    >
                      {t("studentsPage.delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">{t('studentsPage.noStudents')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {selectedStudent && (
        <EditScheduleModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          student={selectedStudent}
        />
      )}
    </Container>
  );
};