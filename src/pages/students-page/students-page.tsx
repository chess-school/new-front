import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';
import { useTranslation } from "react-i18next";
import EditScheduleModal from '../../components/Schedule/EditScheduleModal';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const coachEmail = JSON.parse(localStorage.getItem('user') || '{}').email;

  const fetchStudentDetails = async (studentId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/student?coachEmail=${coachEmail}&studentId=${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        console.error(`Ошибка при получении данных ученика с ID ${studentId}`);
        return null;
      }
    } catch (error) {
      console.error(`Ошибка при получении данных ученика с ID ${studentId}:`, error);
      return null;
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/students?coachEmail=${coachEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const studentIds = response.data;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        console.error('Список студентов пуст или имеет неверный формат');
        setStudents([]);
        return;
      }

      const studentDetailsPromises = studentIds.map((id: any) => {
        const studentId = typeof id === 'object' ? id._id : id;
        return fetchStudentDetails(studentId);
      });

      const studentDetails = await Promise.all(studentDetailsPromises);
      setStudents(studentDetails.filter((student) => student !== null));
    } catch (error) {
      console.error('Ошибка при получении списка учеников:', error);
      setStudents([]);
    }
  };

  const handleEditSchedule = (student: Student) => {
    setSelectedStudent(student);
    setOpenModal(true);
  };

  const handleRemoveStudent = async (studentId: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:3000/api/trainer/remove-student?coachEmail=${coachEmail}&studentId=${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert(t('studentsPage.studentDeletedSuccess'));
      fetchStudents(); // Обновляем список учеников после удаления
    } catch (error) {
      console.error('Ошибка при удалении ученика:', error);
      alert('studentsPage.studentDeletedError');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [coachEmail]);

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
              <TableCell>{t("studentsPage.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.firstName}</TableCell>
                <TableCell>{student.lastName}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
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
            ))}
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
