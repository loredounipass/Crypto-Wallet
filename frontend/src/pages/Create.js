import React from 'react';
import ProviderForm from '../components/providers/ProviderFom';
import { Typography, Box } from '../ui/material';
import { PersonAdd as PersonAddIcon } from '../ui/icons'; 

export default function CreateProvider() {
    return (
        <div>
            <Box display="flex" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" p={1} bgcolor="#333" borderRadius={2}>
                    <PersonAddIcon style={{ color: 'green', marginRight: '8px' }} />
                    <Typography variant="h6" style={{ color: 'white' }}>
                        Create Provider
                    </Typography>
                </Box>
            </Box>
            <ProviderForm />
        </div>
    );
}
