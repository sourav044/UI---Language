using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Resources;
using System.Windows;
using System.Windows.Controls;

namespace ResxEditor
{
    public partial class MainWindow : Window
    {
        private Dictionary<string, Dictionary<string, string>> resxData = new Dictionary<string, Dictionary<string, string>>();
        private Dictionary<string, ListBox> resxListBoxes = new Dictionary<string, ListBox>();
        private Dictionary<string, string> filePaths = new Dictionary<string, string>();
        private string selectedKey = string.Empty;

        public MainWindow()
        {
            InitializeComponent();
        }

        private void LoadResxFiles_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog
            {
                Multiselect = true,
                Filter = "Resource files (*.resx)|*.resx|All files (*.*)|*.*"
            };

            if (openFileDialog.ShowDialog() == true)
            {
                foreach (string filePath in openFileDialog.FileNames)
                {
                    string fileName = Path.GetFileName(filePath);
                    var resxEntries = ReadResxFile(filePath);

                    resxData[fileName] = resxEntries;
                    filePaths[fileName] = filePath;
                    DisplayResxFile(fileName, resxEntries);
                }
            }
        }

        private Dictionary<string, string> ReadResxFile(string filePath)
        {
            var entries = new Dictionary<string, string>();

            using (var reader = new ResXResourceReader(filePath))
            {
                foreach (DictionaryEntry entry in reader)
                {
                    entries.Add(entry.Key.ToString(), entry.Value.ToString());
                }
            }

            return entries;
        }

        private void DisplayResxFile(string fileName, Dictionary<string, string> data)
        {
            if (resxListBoxes.ContainsKey(fileName))
            {
                MainPanel.Children.Remove(resxListBoxes[fileName]);
            }

            // Create a ListBox for the RESX data
            ListBox listBox = new ListBox();
            listBox.SelectionChanged += ListBox_SelectionChanged;

            foreach (var entry in data)
            {
                listBox.Items.Add($"{entry.Key}: {entry.Value}");
            }

            resxListBoxes[fileName] = listBox;
            MainPanel.Children.Add(listBox);
        }

        private void ListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (sender is ListBox listBox && listBox.SelectedItem != null)
            {
                string selectedText = listBox.SelectedItem.ToString();
                selectedKey = selectedText.Split(":")[0];
            }
        }

        private void SaveResxFiles_Click(object sender, RoutedEventArgs e)
        {
            foreach (var fileName in resxData.Keys)
            {
                string filePath = filePaths[fileName];
                WriteResxFile(filePath, resxData[fileName]);
            }
            MessageBox.Show("All .resx files have been saved successfully.", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void WriteResxFile(string filePath, Dictionary<string, string> data)
        {
            using (var writer = new ResXResourceWriter(filePath))
            {
                foreach (var entry in data)
                {
                    writer.AddResource(entry.Key, entry.Value);
                }
                writer.Generate();
            }
        }

        private void AddNode_Click(object sender, RoutedEventArgs e)
        {
            AddNodeWindow addNodeWindow = new AddNodeWindow(resxData);
            addNodeWindow.ShowDialog();

            if (addNodeWindow.DialogResult == true)
            {
                string newKey = addNodeWindow.NewKey;
                Dictionary<string, string> newValues = addNodeWindow.NewValues;

                foreach (var fileName in newValues.Keys)
                {
                    resxData[fileName][newKey] = newValues[fileName];
                    RefreshDisplay(fileName);
                }
            }
        }

        private void DeleteNode_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrEmpty(selectedKey))
            {
                MessageBoxResult confirm = MessageBox.Show($"Are you sure you want to delete '{selectedKey}' across all files?", "Confirm Delete", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (confirm == MessageBoxResult.Yes)
                {
                    foreach (var data in resxData.Values)
                    {
                        if (data.ContainsKey(selectedKey))
                        {
                            data.Remove(selectedKey);
                        }
                    }

                    RefreshDisplayAll();
                }
            }
        }

        private void SearchNode_Click(object sender, RoutedEventArgs e)
        {
            string searchKey = SearchEntry.Text.ToLower();
            if (string.IsNullOrEmpty(searchKey))
            {
                RefreshDisplayAll();
                return;
            }

            foreach (var fileName in resxData.Keys)
            {
                var results = resxData[fileName].Where(entry => entry.Key.ToLower().Contains(searchKey)).ToList();
                ListBox listBox = resxListBoxes[fileName];
                listBox.Items.Clear();

                foreach (var result in results)
                {
                    listBox.Items.Add($"{result.Key}: {result.Value}");
                }
            }
        }

        private void RefreshDisplay(string fileName)
        {
            ListBox listBox = resxListBoxes[fileName];
            listBox.Items.Clear();

            foreach (var entry in resxData[fileName])
            {
                listBox.Items.Add($"{entry.Key}: {entry.Value}");
            }
        }

        private void RefreshDisplayAll()
        {
            foreach (var fileName in resxListBoxes.Keys)
            {
                RefreshDisplay(fileName);
            }
        }
    }
}
