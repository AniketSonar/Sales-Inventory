const db = require('../config/db');

// Get all product categories
const getCategories = async (req, res) => {
  try {
    const categories = await db.allAsync(`
      SELECT * FROM categories ORDER BY created_at ASC
    `);
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Create new product category (Receptionist)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    // Check if exists
    const existing = await db.getAsync(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?)`, [trimmedName]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const id = `cat_${Date.now()}`;
    await db.runAsync(`
      INSERT INTO categories (id, name, description)
      VALUES (?, ?, ?)
    `, [id, trimmedName, description ? description.trim() : '']);

    res.status(201).json({ success: true, message: 'Category created successfully', data: { id, name: trimmedName, description } });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

// Update product category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    await db.runAsync(`
      UPDATE categories
      SET name = ?, description = ?
      WHERE id = ?
    `, [name.trim(), description || '', id]);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

// Delete product category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.runAsync(`DELETE FROM categories WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
