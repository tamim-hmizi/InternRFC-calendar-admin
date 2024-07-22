"use client";
import React, { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { Search2Icon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  
  /*const router = useRouter();
  const {id } = router.query;*/

  const [searchQuery, setSearchQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      }
    }

    fetchData();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setStartIndex(0);
  };

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageSize = 5;
  const endIndex = startIndex + pageSize;
  const displayedData = filteredData.slice(startIndex, endIndex);

  const canGoPrevious = startIndex > 0;
  const canGoNext = endIndex < filteredData.length;

  const goToPrevious = () => {
    setStartIndex(Math.max(0, startIndex - pageSize));
  };

  const goToNext = () => {
    setStartIndex(startIndex + pageSize);
  };

  return (
    <Flex>
      <Box flex="1" p={4}>
        <Flex justify="flex-end" mb={4}>
          <Box width="300px">
            <InputGroup>
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label="Search"
                  icon={<Search2Icon />}
                  onClick={() => {}}
                />
              </InputRightElement>
            </InputGroup>
          </Box>
        </Flex>

        {error && <Box color="red.500" mb={4}>{error}</Box>}

        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
              
                <Th>Nom Prénom</Th>
                <Th>Calendrier</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedData.map((item) => (
                <Tr key={item.email}>
                  
                  <Td> {item.name}</Td>
                  <Td>
                    <Link href={`/calendar/${item.email}`} key={item.email}>
                      <IconButton
                        aria-label="Calendar"
                        icon={<CalendarIcon />}
                      />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex mt={4} justify="space-between">
          <IconButton
            aria-label="Previous"
            icon={<ChevronLeftIcon />}
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            display={startIndex === 0 ? 'none' : 'block'}
          />
          <IconButton
            aria-label="Next"
            icon={<ChevronRightIcon />}
            onClick={goToNext}
            disabled={!canGoNext}
            display={endIndex >= filteredData.length ? 'none' : 'block'}
          />
        </Flex>
      </Box>
    </Flex>
  );
}
